package com.brainoverflow.server.common.ws

import org.springframework.web.socket.server.support.DefaultHandshakeHandler
import org.springframework.http.server.ServerHttpRequest
import org.springframework.web.socket.WebSocketHandler
import java.security.Principal
import java.util.*

class CustomHandshakeHandler : DefaultHandshakeHandler() {
    override fun determineUser(
        request: ServerHttpRequest,
        wsHandler: WebSocketHandler,
        attributes: MutableMap<String, Any>
    ): Principal? {
        val userId = attributes["userId"] as? UUID
        if (userId != null) {
            return StompPrincipal(userId.toString())
        }
        return null
    }
}
