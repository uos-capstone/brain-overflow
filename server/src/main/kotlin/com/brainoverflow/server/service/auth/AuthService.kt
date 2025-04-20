package com.brainoverflow.server.service.auth

import com.brainoverflow.server.api.dto.request.user.LoginRequest
import com.brainoverflow.server.api.dto.request.user.SignupRequest
import com.brainoverflow.server.api.dto.response.user.TokenResponse
import com.brainoverflow.server.common.auth.JwtProvider
import com.brainoverflow.server.common.enums.ReturnCode
import com.brainoverflow.server.common.exception.BOException
import com.brainoverflow.server.domain.user.User
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
    private val jwtProvider: JwtProvider,
    private val userRepository: UserRepository,
) {
    fun login(loginRequest: LoginRequest): TokenResponse {
        val user = userRepository.findByUsername(loginRequest.username) ?: throw BOException(ReturnCode.NOT_EXIST_USER)
        checkPassword(user, user.password)

        val token = jwtProvider.generateToken(user.username, user.id.toString())
        return TokenResponse(token, user.id)
    }

    private fun checkPassword(user: User, password: String) {
        if (user.password != password) {
            throw BOException(ReturnCode.WRONG_PASSWORD)
        }
    }

    @Transactional
    fun signup(signupRequest: SignupRequest) {
        userRepository.save(signupRequest.toUser())
    }
}