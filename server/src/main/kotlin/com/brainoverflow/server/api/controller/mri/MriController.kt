package com.brainoverflow.server.api.controller.mri

import com.brainoverflow.server.api.dto.request.mri.MriResultDto
import com.brainoverflow.server.service.mri.MriService
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.*

@RestController
@RequestMapping("/mri")
class MriController (
    private val mriService: MriService
){
    @PostMapping
    fun registerMRI(
//        @AuthenticationPrincipal userDetails: UserDetails
    ){
        mriService.registerMRIImage()
    }

    @PostMapping("/check-ad")
    fun calculateMRI(
        @RequestParam mriImageId : UUID
    ){
        mriService.registerMRIPrediction(mriImageId)
    }

    @PostMapping("/check/complete")
    fun completeMRI(
        @RequestBody mriResultDto: MriResultDto
    ){
        mriService.receiveResult(mriResultDto)
    }
}