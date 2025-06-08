import torch
import torch.nn as nn
import torch.nn.functional as F


class EMAQuantizer(nn.Module):
    def __init__(self, embedding_dim, num_embeddings, decay=0.95, epsilon=1e-5, clip_val=2.0, reset_after=20_000):
        super().__init__()
        self.embedding_dim = embedding_dim
        self.num_embeddings = num_embeddings
        self.decay = decay
        self.epsilon = epsilon

        # Codebook embedding
        self.embedding = nn.Parameter(torch.randn(num_embeddings, embedding_dim))
        self.embedding.requires_grad = False  # Updated using EMA

        # EMA variables
        self.register_buffer("cluster_size", torch.zeros(num_embeddings))
        self.register_buffer("ema_embedding", torch.randn(num_embeddings, embedding_dim))
        self.clip_val = clip_val
        print(f"[EMAQuantizer] clip_val={self.clip_val}")
        if self.clip_val is None:
            print("[EMAQuantizer] clip_val=None → skip clamping codebook update")
        self.reset_after = reset_after
        self.register_buffer("step", torch.zeros(1, dtype=torch.long))

    def forward(self, z_e):
            # z_e: (B, C, D, H, W)
            B, C, D, H, W = z_e.shape
            z_e_flattened = z_e.permute(0, 2, 3, 4, 1).reshape(-1, C)  # (B*D*H*W, C)

            # Compute distances
            distances = (
                z_e_flattened.pow(2).sum(1, keepdim=True)
                - 2 * z_e_flattened @ self.embedding.t()
                + self.embedding.pow(2).sum(1)
            )  # (N, K)

            # Encoding
            encoding_indices = torch.argmin(distances, dim=1)  # (N,)
            encodings = F.one_hot(encoding_indices, self.num_embeddings).type(z_e.dtype)  # (N, K)

            # Quantize and reshape
            quantized = encodings @ self.embedding  # (N, C)
            quantized = quantized.view(B, D, H, W, C).permute(0, 4, 1, 2, 3).contiguous()  # (B, C, D, H, W)

            # EMA update
            if self.training:
                self.step += 1
                self._ema_update(z_e_flattened, encodings)

            # Loss
            commitment_loss = F.mse_loss(quantized.detach(), z_e)
            codebook_loss = F.mse_loss(quantized, z_e.detach())

            # Straight-through estimator
            quantized = z_e + (quantized - z_e).detach()
            if torch.isnan(quantized).any() or torch.isinf(quantized).any():
                raise ValueError("NaN/Inf in quantized tensor")

            return quantized, {
                'codebook_loss': codebook_loss,
                'commitment_loss': commitment_loss
            }, encoding_indices.view(B, D, H, W)

    def _ema_update(self, flat_input, encodings):
        # Sum over encodings per code
        updated_cluster_size = encodings.sum(0)  # (K,)

        # Laplace smoothing of cluster size
        self.cluster_size.data.mul_(self.decay).add_(updated_cluster_size,
                                                 alpha = 1 - self.decay).clamp_(min=self.epsilon)
        n = self.cluster_size.sum()
        cluster_size = (
            (self.cluster_size + self.epsilon)
            / (n + self.num_embeddings * self.epsilon) * n
        )

        # Update embedding average
        dw = encodings.t() @ flat_input  # (K, C)
        self.ema_embedding.data.mul_(self.decay).add_(dw, alpha=1 - self.decay)

        # Normalize to get new embeddings
        new_embed = self.ema_embedding / cluster_size.unsqueeze(1)

        if self.clip_val is not None:
            new_embed = torch.clamp(new_embed, -self.clip_val, self.clip_val)


        # new_embed = torch.clamp(new_embed, -self.clip_val, self.clip_val)
        # self.embedding.data.copy_(new_embed)

        if self.clip_val is not None:
            self.embedding.data.copy_(new_embed.clamp_(-self.clip_val, self.clip_val))
        else:
            self.embedding.data.copy_(new_embed)

        # if self.training:
        #     dead = self.cluster_size < 5.0
        #     if dead.any():
        #         rand_idx = torch.randint(0, flat_input.size(0), (dead.sum(),), device=flat_input.device)
        #         self.embedding.data[dead] = flat_input[rand_idx].to(self.embedding.dtype)
        #         self.ema_embedding.data[dead] = flat_input[rand_idx].to(self.ema_embedding.dtype)
        #
        #         self.cluster_size.data[dead] = 1.0

        # if self.step.item() >= self.reset_after:
        #     dead = self.cluster_size < 1.0  # 진짜 안 쓰이는 코드만
        #     if dead.any():
        #         rand = torch.randint(0, flat_input.size(0),
        #                              (dead.sum(),), device=flat_input.device)
        #         self.embedding.data[dead] = flat_input[rand].to(self.embedding.dtype)
        #         self.ema_embedding.data[dead] = flat_input[rand].to(self.ema_embedding.dtype)
        #         self.cluster_size.data[dead] = 1.0

        if self.step.item() >= self.reset_after:
            dead = self.cluster_size < 5.0
            if dead.any():
                rand = torch.randint(0, flat_input.size(0), (dead.sum(),), device=flat_input.device)
                self.embedding.data[dead] = flat_input[rand].to(self.embedding.dtype)
                self.ema_embedding.data[dead] = flat_input[rand].to(self.ema_embedding.dtype)
                self.cluster_size.data[dead] = 1.0
            self.step.zero_()


    def get_codebook(self):
        return self.embedding

    def get_usage(self):
        return (self.cluster_size > 0).float().sum().item() / self.num_embeddings
