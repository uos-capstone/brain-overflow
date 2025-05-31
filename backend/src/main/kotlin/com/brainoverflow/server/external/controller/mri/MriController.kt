package com.brainoverflow.server.external.controller.mri

import com.brainoverflow.server.domain.mri.Gender
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

    @PostMapping(
        consumes = [MediaType.MULTIPART_FORM_DATA_VALUE],
    )
    fun registerMRI(
        @AuthenticationPrincipal user: UserDetails,
        @RequestPart("file") file: MultipartFile,
        @RequestParam age: Int,
        @RequestParam gender: Gender,
    ): ApiResponse<UUID> {
        val mriUUID =
            mriService.registerMRIImage(file, UUID.fromString(user.username), age, gender)
        return ApiResponse.success(mriUUID)
    }

    @PostMapping("/check-ad")
    fun calculateMRI(
        @RequestParam mriImageId: UUID,
        @RequestParam targetAge: Int,
    ): ApiResponse<Void> {
        mriService.registerMRIPrediction(mriImageId, targetAge)
        return ApiResponse.success()
    }

    @PostMapping(
        "/check/complete",
        consumes = [MediaType.MULTIPART_FORM_DATA_VALUE],
    )
    fun completeMRI(
        @RequestPart("file") file: MultipartFile,
        @RequestParam mriImageId: UUID,
        @RequestParam mriResultId: Long,
    ): ApiResponse<Void> {
        mriService.receiveResult(file, mriImageId, mriResultId)
        return ApiResponse.success()
    }

    @GetMapping("/result/{id}")
    fun getMriResultData(
        @PathVariable id: Long,
    ): ApiResponse<MriResultDto> {
        val mriResult = mriService.getMriResult(id)
        return ApiResponse.success(MriResultDto.fromDomain(mriResult))
    }
}
