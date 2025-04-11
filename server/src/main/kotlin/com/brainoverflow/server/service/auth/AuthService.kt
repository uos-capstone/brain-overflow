package com.brainoverflow.server.service.auth

import com.brainoverflow.server.api.dto.request.user.LoginRequest
import com.brainoverflow.server.api.dto.request.user.SignupRequest
import com.brainoverflow.server.api.dto.response.user.TokenResponse
import com.brainoverflow.server.common.auth.JwtProvider
import com.brainoverflow.server.common.enums.ReturnCode
import com.brainoverflow.server.common.exception.BOException
import com.brainoverflow.server.domain.user.UserRepository
import org.springframework.data.repository.findByIdOrNull
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class AuthService(
    private val authenticationManager: AuthenticationManager,
    private val jwtProvider: JwtProvider,
    private val userRepository: UserRepository,
) {
    fun login(loginRequest: LoginRequest): TokenResponse {
        val authToken = UsernamePasswordAuthenticationToken(loginRequest, loginRequest.password)
        val authentication: Authentication = authenticationManager.authenticate(authToken)
        val user = userRepository.findByUsername(loginRequest.username) ?: throw BOException(ReturnCode.NOT_EXIST_USER)

        val token = jwtProvider.generateToken(authentication, user.id.toString())
        return TokenResponse(token)
    }

    @Transactional
    fun signup(signupRequest: SignupRequest) {
        userRepository.save(signupRequest.toUser())
    }
}