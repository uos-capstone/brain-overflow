package com.brainoverflow.server.common.config


import com.brainoverflow.server.common.auth.JwtAuthenticationFilter
import com.brainoverflow.server.service.auth.CustomUserDetailsService
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.dao.DaoAuthenticationProvider
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder as AuthBuilder
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter

@Configuration
@EnableWebSecurity
class SecurityConfig(
    private val customUserDetailsService: CustomUserDetailsService,
    private val jwtAuthenticationFilter: JwtAuthenticationFilter
) {
    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .csrf { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests {
                it.requestMatchers("/auth/login", "/auth/signup").permitAll()
                it.anyRequest().authenticated()
            }

        // DaoAuthenticationProvider 등록
        http.authenticationProvider(daoAuthenticationProvider())

        // JWT 인증 필터를 UsernamePasswordAuthenticationFilter 이전에 삽입
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter::class.java)

        return http.build()
    }

    @Bean
    fun daoAuthenticationProvider() = DaoAuthenticationProvider().apply {
        setUserDetailsService(customUserDetailsService)
        setPasswordEncoder(passwordEncoder())
    }

    // AuthenticationManager를 Bean으로 등록
    @Bean
    fun authenticationManager(http: HttpSecurity): AuthenticationManager {
        return http.getSharedObject(AuthBuilder::class.java)
            .authenticationProvider(daoAuthenticationProvider())
            .build()
    }

    @Bean
    fun passwordEncoder() = BCryptPasswordEncoder()
}
