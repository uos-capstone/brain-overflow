import pika
import json
import torch
from tqdm import tqdm
from models import const
import yaml
import argparse
from models.vqvae import VQVAE
from models.controlnet import ControlNet
from scheduler.linear_noise_scheduler import LinearNoiseScheduler
from monai import transforms
from monai.data.image_reader import NumpyReader
from uuid import UUID
import numpy as np
import nibabel as nib
import os
import requests

device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
if torch.backends.mps.is_available():
    device = torch.device('mps')
    print('Using mps')

RABBITMQ_HOST = 'unknownpgr.com'
RABBITMQ_QUEUE = 'mriPredictionQueue'
RABBITMQ_USER = 'guest'
RABBITMQ_PASS = 'guest'


# REST API 설정
API_ENDPOINT = "https://api-brain-overflow.unknownpgr.com"
API_HEADERS = {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzdHJpbmciLCJ1c2VySWQiOiIwZTU1NGZlMC05MzViLTQ0ZjYtYTNlYS1hMWI1MGI4Y2NmNjMiLCJpYXQiOjE3NDkxNzMwMDgsImV4cCI6MTc0OTE3OTAwOH0.qoNiejshJZ0weHgplul2b3FisQmlCCxBeijRibEApmU",
    "Content-Type": "application/json"
}

# def on_message(ch, method, properties, body):
#     try:
#         print("📥 [RECEIVED] Raw message:")
#         print(body)
#
#         message = json.loads(body)
#         print("✅ [PARSED] Message as JSON:")
#         print(json.dumps(message, indent=4))
#
#     except Exception as e:
#         print(f"[ERROR] Failed to parse message: {e}")

# def main():
#     credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
#     connection = pika.BlockingConnection(
#         pika.ConnectionParameters(host=RABBITMQ_HOST, port=30000, credentials=credentials)
#     )
#     channel = connection.channel()
#
#     method_frame, header_frame, body = channel.basic_get(queue=RABBITMQ_QUEUE)
#     if method_frame:
#         print("✅ Found a message in queue:")
#         print(body)
#     else:
#         print("❌ No message in queue")
#
#     connection.close()
#
#     # channel.queue_declare(queue=RABBITMQ_QUEUE, durable=True)
#
#     print(f"🔌 Listening on queue '{RABBITMQ_QUEUE}'...")
#
#     channel.basic_consume(queue=RABBITMQ_QUEUE, on_message_callback=on_message, auto_ack=True)
#     channel.start_consuming()

# def main():
#     credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
#     connection = pika.BlockingConnection(
#         pika.ConnectionParameters(host=RABBITMQ_HOST, port=30000, credentials=credentials)
#     )
#     channel = connection.channel()
#
#     # 디버깅: 메시지가 큐에 존재하는지 확인
#     method_frame, header_frame, body = channel.basic_get(queue=RABBITMQ_QUEUE, auto_ack=False)
#     if method_frame:
#         print("🔍 [DEBUG] Found message in queue (peek):")
#         print(body)
#         # 다시 큐에 남겨두고 넘어감 (ack 안 함)
#     else:
#         print("🕓 [DEBUG] No message in queue at startup")
#
#     print(f"🔌 Listening on queue '{RABBITMQ_QUEUE}'...")
#
#     channel.basic_consume(queue=RABBITMQ_QUEUE, on_message_callback=on_message, auto_ack=True)
#     channel.start_consuming()

# def main():
#     credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
#     connection = pika.BlockingConnection(
#         pika.ConnectionParameters(host=RABBITMQ_HOST, port=30000, credentials=credentials)
#     )
#     channel = connection.channel()
#
#     # 정확한 Exchange 선언 (Spring과 일치해야 함)
#     channel.exchange_declare(exchange='AlzheimerAiQueue', exchange_type='fanout', durable=True)
#
#     # 정확한 Queue 선언 (Spring이 만든 큐 이름과 일치해야 함)
#     channel.queue_declare(queue='mriPredictionQueue', durable=True)
#
#     # 바인딩 수행
#     channel.queue_bind(exchange='AlzheimerAiQueue', queue='mriPredictionQueue')
#
#     print("🔌 Listening on queue 'mriPredictionQueue' from exchange 'AlzheimerAiQueue'...")
#
#     channel.basic_consume(
#         queue='mriPredictionQueue',
#         on_message_callback=on_message,
#         auto_ack=True
#     )
#
#     channel.start_consuming()


# def main():
#     credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
#     connection = pika.BlockingConnection(
#         pika.ConnectionParameters(host=RABBITMQ_HOST, port=30000, credentials=credentials)
#     )
#     channel = connection.channel()
#
#     # ❗️Exchange와 Queue를 바인딩
#     channel.exchange_declare(exchange='aiQueueExchange', exchange_type='fanout', durable=True)
#     result = channel.queue_declare(queue='', exclusive=True)  # ephemeral queue
#     queue_name = result.method.queue
#
#     channel.queue_bind(exchange='aiQueueExchange', queue=queue_name)
#     channel.basic_consume(queue=queue_name, on_message_callback=on_message, auto_ack=True)
#     channel.start_consuming()
#
#     # channel.exchange_declare(exchange='aiQueueExchange', exchange_type='fanout', durable=True)
#     # result = channel.queue_declare(queue='', exclusive=True)  # 임시 큐
#     # queue_name = result.method.queue
#     #
#     # channel.queue_bind(exchange='aiQueueExchange', queue=queue_name)
#     #
#     # print(f"🔌 Listening on queue '{RABBITMQ_QUEUE}'...")
#     #
#     # channel.basic_consume(queue=queue_name, on_message_callback=on_message, auto_ack=True)
#     # channel.start_consuming()
#
#
# if __name__ == "__main__":
#     main()






##################################################################

def download_nifti_from_url(image_url: str, save_dir: str = "/DataRead2/chsong/demo") -> str:
    base_url = "https://api-brain-overflow.unknownpgr.com/uploads/"
    full_url = base_url + image_url

    filename = image_url
    save_path = os.path.join(save_dir, filename)

    os.makedirs(save_dir, exist_ok=True)

    response = requests.get(full_url)
    if response.status_code != 200:
        raise RuntimeError(f" Failed to download file. Status code: {response.status_code}")

    with open(save_path, "wb") as f:
        f.write(response.content)

    print(f"File saved to {save_path}")
    return save_path

def send_result_to_backend(result_nii_path: str, mri_image_id: UUID, mri_result_id: int):
    if result_nii_path is None or not os.path.exists(result_nii_path):
        print(f"[ERROR] result_nii_path is invalid: {result_nii_path}")
        return
    url = f"https://api-brain-overflow.unknownpgr.com/mri/check/complete"
    params = {
        'mriImageId': str(mri_image_id),
        'mriResultId': mri_result_id
    }
    with open(result_nii_path, 'rb') as f:
        files = {'file': (os.path.basename(result_nii_path), f, 'application/octet-stream')}
        response = requests.post(url, params=params, files=files, headers={"Authorization": API_HEADERS["Authorization"]})
    if response.status_code != 200:
        print(f"Upload failed: {response.status_code} {response.text}")
    else:
        print("Upload complete")


def concat_covariates(data_dict):
    conditions = [
        data_dict['followup_age'],
        data_dict['sex'],
        data_dict['followup_diagnosis'],
        data_dict['followup_cerebral_cortex'],
        data_dict['followup_hippocampus'],
        data_dict['followup_amygdala'],
        data_dict['followup_cerebral_white_matter'],
        data_dict['followup_lateral_ventricle'],
    ]
    data_dict['context'] = torch.tensor(conditions, dtype=torch.float32).unsqueeze(0)
    return data_dict


@torch.no_grad()
def inference(nifti_path: str, sex: int, target_diagnosis: int, starting_age: int, target_age: int, config_path: str):
    print("[DEBUG] Entered inference()")

    try:
        # Read the config file #
        with open(config_path, 'r') as file:
            try:
                config = yaml.safe_load(file)
            except yaml.YAMLError as exc:
                print(exc)
        print(config)
        ############################################################

        diffusion_config = config['diffusion_params']
        ldm_config = config['ldm_params']
        vqvae_config = config['vqvae_params']
        train_config = config['train_params']


        ############################################################
        # Instantiate the controlnet
        controlnet = ControlNet(im_channels=vqvae_config['z_channels'],
                                model_config=ldm_config,
                                model_locked=True,
                                model_ckpt=os.path.join(train_config['task_name'], train_config['ldm_ckpt_name']),
                                device=device).to(device)
        controlnet.eval()

        assert os.path.exists(train_config['controlnet_best_ckpt_name']), "Train ControlNet first"
        checkpoint = torch.load(train_config['controlnet_best_ckpt_name'])
        controlnet.load_state_dict(checkpoint['model_state_dict'])
        print('Loaded controlnet checkpoint')


        vqvae = VQVAE(im_channels=vqvae_config['im_channels'],
                      model_config=vqvae_config).to(device)
        vqvae.eval()

        # Load trained vqvae if checkpoint exists
        path = os.path.join(train_config['vqvae_best_ckpt_name'])
        # path = "/DataRead2/chsong/checkpoints/vqvae_best_ckpt_13.pth"
        assert os.path.exists(path), \
            "VQVAE checkpoint not present. Train VQVAE first."
        ckpt = torch.load(path, map_location=device)
        new_state_dict = {k.replace("_orig_mod.", ""): v for k, v in ckpt["model_state_dict"].items()}
        vqvae.load_state_dict(new_state_dict)
        print('Loaded vqvae checkpoint')

        vqvae = VQVAE(im_channels=vqvae_config['im_channels'],
                      model_config=vqvae_config).to(device)
        vqvae.eval()
        ############################################################

        # Create the noise scheduler
        scheduler = LinearNoiseScheduler(num_timesteps=diffusion_config['num_timesteps'],
                                         beta_start=diffusion_config['beta_start'],
                                         beta_end=diffusion_config['beta_end'],
                                         ldm_scheduler=True)

        transforms_fn = transforms.Compose([
            transforms.LoadImaged(keys=['starting_latent_path'], reader=NumpyReader()),
            transforms.EnsureChannelFirstD(keys=["starting_latent_path"], channel_dim=0),
            transforms.SpacingD(keys=["starting_latent_path"], pixdim=const.RESOLUTION, mode="bilinear"),
            transforms.EnsureTypeD(keys=["starting_latent_path"],
                                   data_type="tensor", track_meta=False),
            transforms.ResizeWithPadOrCropD(keys=['starting_latent_path'], spatial_size=(32, 40, 32)),
            transforms.Lambda(func=concat_covariates),
            transforms.ToTensorD(keys=['starting_latent_path', "context"], track_meta=False),
        ])


        sample_dict = {
            "starting_latent_path": nifti_path,
            "followup_age": target_age,
            "sex": sex,
            "followup_diagnosis": target_diagnosis,
            "followup_cerebral_cortex": 0.6491297655695000,
            "followup_hippocampus": 0.6981271562345980,
            "followup_amygdala": 0.7763787459078320,
            "followup_cerebral_white_matter": 0.5346564766939970,
            "followup_lateral_ventricle": 0.17370481207305900,
        }

        # transformed = transforms_fn(sample_dict)

        try:
            transformed = transforms_fn(sample_dict)
        except Exception as e:
            print(f"[ERROR] Failed during transform: {e}")
            return None

        context = transformed['context'].to(device)
        # starting_z = transformed['starting_latent_path'].to(device)
        # n = starting_z.shape[0]
        # starting_a = torch.full((n, 1, *starting_z.shape[-3:]), starting_age, dtype=torch.float32, device=device)
        # starting_a = starting_age.to(device)

        scale_factor =12.8

        # concatenating_age = starting_a.view(n, 1, 1, 1, 1).expand(n, 1, *starting_z.shape[-3:])
        # controlnet_condition = torch.cat([starting_z, concatenating_age], dim=1)
        # controlnet_condition = torch.cat([starting_z, starting_a], dim=1)

        starting_z = transformed['starting_latent_path'].to(device)
        if starting_z.dim() == 4:
            starting_z = starting_z.unsqueeze(0)  # Make it 5D: [1, C, D, H, W]

        n = starting_z.shape[0]  # batch size
        starting_a = torch.tensor(starting_age, dtype=torch.float32, device=device)
        starting_a = starting_a.view(1).expand(n)  # [n]

        concatenating_age = starting_a.view(n, 1, 1, 1, 1).expand(n, 1, *starting_z.shape[-3:])
        controlnet_condition = torch.cat([starting_z, concatenating_age], dim=1)

        # n = starting_z.shape[0]  # batch size
        # starting_a = torch.tensor(starting_age, dtype=torch.float32, device=device).view(1).expand(n)  # [B]

        # concatenating_age = starting_a.view(n, 1, 1, 1, 1).expand(n, 1, *starting_z.shape[-3:])  # [B,1,D,H,W]

        # controlnet_condition = torch.cat([starting_z, concatenating_age], dim=1)  # [B, C+1, D, H, W]

        # starting_a = torch.tensor(starting_age, dtype=torch.float32, device=device)
        # starting_a = starting_a.view(1).expand(n)  # [n] 배치 크기 맞추기
        #
        # concatenating_age = starting_a.view(n, 1, 1, 1, 1).expand(n, 1, *starting_z.shape[-3:])
        # controlnet_condition = torch.cat([starting_z, concatenating_age], dim=1)

        print(f"[DEBUG] transformed keys: {list(transformed.keys())}")
        print(f"[DEBUG] starting_z shape: {starting_z.shape}")

        # drawing a random z_T ~ N(0,I)
        xt = torch.randn(const.LATENT_SHAPE_DM).unsqueeze(0).to(device)

        for t in tqdm(reversed(range(diffusion_config['num_timesteps']))):

            n = xt.size(0)
            t_tensor = torch.full((n,), t, device=device, dtype=torch.long)

            # Get Controlnet prediction of noise
            noise_pred = controlnet(
                xt,
                t_tensor,
                context,
                controlnet_condition)

            # Use scheduler to get x0 and xt-1
            xt, x0_pred = scheduler.sample_prev_timestep(xt, noise_pred, torch.as_tensor(t).to(device))

            # Save x0
            # ims = torch.clamp(xt, -1., 1.).detach().cpu()
            if t == 0:
                # Decode ONLY the final image to save time
                ims = vqvae.to(device).decode(xt / scale_factor)
                print("decode raw min/max:", ims.min().item(), ims.max().item())
            else:
                ims = xt

            ims = torch.clamp(ims, -1., 1.).detach().cpu()
            ims = (ims + 1) / 2

        nifti_img = nib.Nifti1Image(ims.squeeze().numpy(), affine=np.eye(4))

        filename = os.path.basename(nifti_path)
        if filename.endswith(".nii"):
            base_name = filename[:-4]
        else:
            base_name = filename

        save_path = os.path.join(os.path.dirname(nifti_path), f"{base_name}_result.nii")

        nib.save(nifti_img, save_path)

        print(f"[DEBUG] Returning result path: {save_path}")

        return save_path

    except Exception as e:
        print(f"[ERROR] Inference failed: {e}")
        return None


def on_message(ch, method, properties, body):
    try:
        print("📥 [RECEIVED] Raw message:")
        print(body)

        message = json.loads(body)
        print("✅ [PARSED] Message as JSON:")
        print(json.dumps(message, indent=4))

    except Exception as e:
        print(f"[ERROR] Failed to parse message: {e}")

    try:
        message = json.loads(body)
        image_url = message["imageURL"]
        target_diagnosis = {"CN": 0, "MCI": 0.5, "AD": 1}.get(message["targetDiagnosis"], 1)
        last_age = message["lastAge"] / 100
        gender = 0 if message["gender"] == "MALE" else 1
        target_age = message["targetAge"] / 100
        mri_image_id = message["mriImageId"]
        mri_result_id = message["mriResultId"]

        # 이미지 다운로드 & 저장
        image_path = download_nifti_from_url(image_url)

        # 추론 수행
        result_path = inference(image_path, gender, target_diagnosis, last_age, target_age, args.config_path)

        if result_path is None:
            print("[ERROR] inference() returned None, skipping upload.")
            return

        # 결과 전송
        send_result_to_backend(result_path, mri_image_id, mri_result_id)

    except Exception as e:
        print(f"Error processing message: {e}")


def main():
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host=RABBITMQ_HOST, port=30000, credentials=credentials)
    )
    channel = connection.channel()

    channel.exchange_declare(exchange='AlzheimerAiQueue', exchange_type='fanout', durable=True)
    channel.queue_declare(queue='mriPredictionQueue', durable=True)

    channel.queue_bind(exchange='AlzheimerAiQueue', queue='mriPredictionQueue')

    print("🔌 Listening on queue 'mriPredictionQueue' from exchange 'AlzheimerAiQueue'...")

    channel.basic_consume(
        queue='mriPredictionQueue',
        on_message_callback=on_message,
        auto_ack=True
    )

    channel.start_consuming()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Arguments for controlnet evaluation')
    parser.add_argument('--config', dest='config_path',
                        default='config/adni.yaml', type=str)
    args = parser.parse_args()
    main()