package com.brainoverflow.server.external.controller.mri

import com.brainoverflow.server.external.controller.response.ApiResponse
import com.brainoverflow.server.external.dto.request.mri.MriResultDto
import com.brainoverflow.server.external.dto.response.mri.MriImageDto
import com.brainoverflow.server.service.mri.MriService
import org.springframework.http.MediaType
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.util.*

@RestController
@RequestMapping("/mri")
class MriController(
    private val mriService: MriService,
) {
    @GetMapping
    fun getUserMRI(
        @AuthenticationPrincipal user: UserDetails,
    ): ApiResponse<List<MriImageDto>> {
        val response = mriService.findUserMRIImage(UUID.fromString(user.username))
        return ApiResponse.success(response)
    }

    @GetMapping("{mriId}")
    fun getMRIData(
        @PathVariable mriId: UUID,
    ): ApiResponse<MriImageDto> {
        val response = mriService.findMriImage(mriId)
        return ApiResponse.success(response)
    }

    @PostMapping(consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun registerMRI(
        @AuthenticationPrincipal user: UserDetails,
        @RequestPart("file") file: MultipartFile,
    ): ApiResponse<String> {
        mriService.registerMRIImage(file, UUID.fromString(user.username))
        return ApiResponse.success("이미지 저장 성공")
    }

    @PostMapping("/check-ad")
    fun calculateMRI(
        @RequestParam mriImageId: UUID,
    ) {
        mriService.registerMRIPrediction(mriImageId)
    }

    @PostMapping("/check/complete")
    fun completeMRI(
        @RequestBody mriResultDto: MriResultDto,
    ) {
        mriService.receiveResult(mriResultDto)
    }
}
