package com.brainoverflow.server.service.auth

import com.brainoverflow.server.domain.user.UserRepository
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Service

@Service
class CustomUserDetailsService(
    private val userRepository: UserRepository
) : UserDetailsService {

    override fun loadUserByUsername(username: String): UserDetails {
        val user = userRepository.findByUsername(username) ?: throw UsernameNotFoundException("User not found: $username")

        return User.builder()
            .username(user.username)
            .password(user.password) // 이미 BCrypt 처리된 비밀번호라고 가정
            .roles(user.role.name)       // 예: "USER", "ADMIN"
            .build()
    }
}
