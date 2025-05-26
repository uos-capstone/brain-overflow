package com.brainoverflow.server.external.controller.auth

import com.brainoverflow.server.service.auth.CustomUserDetailsService
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class JwtAuthenticationFilter(
    private val jwtProvider: JwtProvider,
    private val customUserDetailsService: CustomUserDetailsService,
) : OncePerRequestFilter() {
    companion object {
        const val AUTH_HEADER = "Authorization"
        const val JWT_HEADER = "Bearer "
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val authorizationHeader = request.getHeader(AUTH_HEADER)

        if (!authorizationHeader.isNullOrBlank() && authorizationHeader.startsWith(JWT_HEADER)) {
            val token = authorizationHeader.substring(7)
            if (jwtProvider.validateToken(token)) {
                val userId = jwtProvider.getUserIdFromToken(token)
                val userDetails: UserDetails = customUserDetailsService.loadUserByUserId(userId)

                val authentication =
                    UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.authorities,
                    )
                authentication.details = WebAuthenticationDetailsSource().buildDetails(request)

                SecurityContextHolder.getContext().authentication = authentication
            }
        }

        filterChain.doFilter(request, response)
    }
}
