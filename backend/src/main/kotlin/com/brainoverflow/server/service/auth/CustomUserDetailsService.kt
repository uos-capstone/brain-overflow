package com.brainoverflow.server.service.auth

import com.brainoverflow.server.domain.exception.BOException
import com.brainoverflow.server.domain.exception.ReturnCode
import com.brainoverflow.server.domain.user.UserRepository
import com.brainoverflow.server.service.UserService
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.stereotype.Service
import java.util.*

@Service
class CustomUserDetailsService(
    private val userService: UserService,
    private val userRepository: UserRepository,
) : UserDetailsService {
    override fun loadUserByUsername(username: String): UserDetails {
        val user =
            userRepository.findByUsername(username) ?: throw BOException(ReturnCode.NOT_EXIST_USER)
        return User.builder()
            .username(user.id.toString())
            .roles(user.role.name) // 예: "USER", "ADMIN"
            .build()
    }

    fun loadUserByUserId(userId: UUID): UserDetails {
        val user = userService.getByUserId(userId)
        return User.builder()
            .username(user.id.toString())
            .password(user.password)
            .roles(user.role.name) // 예: "USER", "ADMIN"
            .build()
    }
}
