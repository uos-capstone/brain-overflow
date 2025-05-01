package com.brainoverflow.server.external.controller.mri

import com.brainoverflow.server.external.dto.request.mri.MriResultDto
import com.brainoverflow.server.service.mri.MriService
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.util.*

@RestController
@RequestMapping("/mri")
class MriController(
    private val mriService: MriService
) {
    @PostMapping(consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun registerMRI(
        @AuthenticationPrincipal user: UserDetails,
        @RequestPart("file") file: MultipartFile
    ): ResponseEntity<String> {
        mriService.registerMRIImage(file, UUID.fromString(user.username))
        return ResponseEntity.ok("MRI 이미지 업로드 성공")
    }

    @PostMapping("/check-ad")
    fun calculateMRI(
        @RequestParam mriImageId: UUID
    ) {
        mriService.registerMRIPrediction(mriImageId)
    }

    @PostMapping("/check/complete")
    fun completeMRI(
        @RequestBody mriResultDto: com.brainoverflow.server.external.dto.request.mri.MriResultDto
    ) {
        mriService.receiveResult(mriResultDto)
    }
}