package com.brainoverflow.server.api.dto.request.user

import com.brainoverflow.server.common.enums.Role
import com.brainoverflow.server.domain.user.User
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder

data class SignupRequest (
    val nickname: String,
    val role : Role,
    val username: String,
    val password: String
){
    companion object{
        private val passwordEncoder = BCryptPasswordEncoder()
    }
    fun toUser(): User {
        val encodePassword = passwordEncoder.encode(password)
        return User(nickname = nickname, role = role, username = username, password = encodePassword)
    }
}