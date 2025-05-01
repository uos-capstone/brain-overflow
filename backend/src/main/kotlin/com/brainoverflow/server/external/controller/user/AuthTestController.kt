package com.brainoverflow.server.external.controller.user

import com.brainoverflow.server.external.controller.response.ApiResponse
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/test")
class AuthTestController {
    @GetMapping("/me")
    fun getUserAuth(@AuthenticationPrincipal userDetails: UserDetails): ApiResponse<String> {
        return ApiResponse.success(userDetails.username)
    }
}