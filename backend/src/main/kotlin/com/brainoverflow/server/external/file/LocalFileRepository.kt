package com.brainoverflow.server.external.file

import com.brainoverflow.server.service.port.FileRepository
import org.springframework.stereotype.Repository
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files
import java.nio.file.Paths
import java.nio.file.StandardCopyOption
import java.util.*

@Repository
class LocalFileRepository : FileRepository {

    private val uploadDir = Paths.get("mri-uploads")  // 상대 경로 or 절대 경로

    init {
        // 디렉토리가 없으면 생성
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir)
        }
    }

    override fun save(file: MultipartFile): String {
        val extension = file.originalFilename?.substringAfterLast('.', "") ?: "dat"
        val fileName = "${UUID.randomUUID()}.$extension"
        val filePath = uploadDir.resolve(fileName)

        Files.copy(file.inputStream, filePath, StandardCopyOption.REPLACE_EXISTING)
        return fileName
    }
}