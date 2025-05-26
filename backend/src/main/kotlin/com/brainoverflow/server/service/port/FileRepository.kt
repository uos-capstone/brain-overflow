package com.brainoverflow.server.service.port

import org.springframework.web.multipart.MultipartFile

interface FileRepository {
    fun save(file: MultipartFile): String
}
