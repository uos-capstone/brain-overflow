package com.brainoverflow.server.external.controller.user

import com.brainoverflow.server.external.controller.response.ApiResponse
import com.brainoverflow.server.external.dto.request.user.LoginRequest
import com.brainoverflow.server.external.dto.request.user.SignupRequest
import com.brainoverflow.server.external.dto.response.user.TokenResponse
import com.brainoverflow.server.external.dto.response.user.UserInfo
import com.brainoverflow.server.service.auth.AuthService
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/auth")
class AuthController(
    val authService: AuthService,
) {
    @PostMapping("/login")
    fun login(
        @RequestBody loginRequest: LoginRequest,
    ): ApiResponse<TokenResponse> {
        val response = authService.login(loginRequest)
        return ApiResponse.success(response)
    }

    @PostMapping("/signup")
    fun signup(
        @RequestBody signupRequest: SignupRequest,
    ): ApiResponse<Void> {
        authService.signup(signupRequest)
        return ApiResponse.success()
    }

    @GetMapping("/me")
    fun getUserInfo(
        @AuthenticationPrincipal userDetails: UserDetails,
    ): ApiResponse<UserInfo> {
        val userId = UUID.fromString(userDetails.username)
        val userInfo = authService.getUserInfo(userId)
        return ApiResponse.success(userInfo)
    }

    @GetMapping
    fun getAllUserInfo(): ApiResponse<List<UserInfo>> {
        val users = authService.findAllUser()
        val userInfos = users.map {
            UserInfo(
                id = it.id,
                nickname = it.nickname,
                role = it.role,
                username = it.username,
            )
        }
        return ApiResponse.success(userInfos)
    }
}
