package com.brainoverflow.server.service.port

import org.springframework.web.multipart.MultipartFile
import java.io.File

interface FileRepository {
    fun save(file: MultipartFile): String
}