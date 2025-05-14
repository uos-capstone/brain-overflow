package com.brainoverflow.server.config


import com.brainoverflow.server.external.controller.auth.JwtAuthenticationFilter
import com.brainoverflow.server.service.auth.CustomUserDetailsService
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.dao.DaoAuthenticationProvider
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder as AuthBuilder


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
                it.requestMatchers(
                    "/auth/login",
                    "/auth/signup", "/mri/**",
                    "/chat/**", "/**.html",
                    "/ws/**", "/swagger-ui/**",
                    "/v3/api-docs",
                    "/v3/api-docs/**",
                    "/chatroom"
                ).permitAll()
                it.anyRequest().authenticated()
            }
            .cors {
                corsConfigurationSource()
            }

        // DaoAuthenticationProvider 등록
        http.authenticationProvider(daoAuthenticationProvider())

        // JWT 인증 필터를 UsernamePasswordAuthenticationFilter 이전에 삽입
        http.addFilterBefore(
            jwtAuthenticationFilter,
            UsernamePasswordAuthenticationFilter::class.java
        )

        return http.build()
    }

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val config = CorsConfiguration()

        config.allowCredentials = true
        config.allowedOrigins =
            listOf("http://localhost:5173", "https://brain-overflow.unknownpgr.com")
        config.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
        config.allowedHeaders = listOf("*")
        config.exposedHeaders = listOf("*")

        val source: UrlBasedCorsConfigurationSource = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", config)
        return source
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
