package com.brainoverflow.server.service.auth

import com.brainoverflow.server.external.dto.response.user.TokenResponse
import com.brainoverflow.server.external.controller.auth.JwtProvider
import com.brainoverflow.server.domain.exception.ReturnCode
import com.brainoverflow.server.domain.exception.BOException
import com.brainoverflow.server.domain.user.User
import com.brainoverflow.server.domain.user.UserRepository
import com.brainoverflow.server.external.dto.response.user.UserInfo
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
@Transactional(readOnly = true)
class AuthService(
    private val jwtProvider: JwtProvider,
    private val userRepository: UserRepository,
) {
    fun login(loginRequest: com.brainoverflow.server.external.dto.request.user.LoginRequest): com.brainoverflow.server.external.dto.response.user.TokenResponse {
        val user = userRepository.findByUsername(loginRequest.username) ?: throw BOException(
            ReturnCode.NOT_EXIST_USER
        )
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
    fun signup(signupRequest: com.brainoverflow.server.external.dto.request.user.SignupRequest) {
        userRepository.save(signupRequest.toUser())
    }

    fun getUserInfo(userId: UUID): UserInfo {
        val user =
            userRepository.findByIdOrNull(userId) ?: throw BOException(ReturnCode.NOT_EXIST_USER)

        return UserInfo(
            user.nickname, user.role, user.username
        )
    }
}