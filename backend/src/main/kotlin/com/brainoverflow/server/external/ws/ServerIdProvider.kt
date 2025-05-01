package com.brainoverflow.server.external.ws

import org.springframework.stereotype.Component
import java.net.InetAddress
import java.util.UUID

@Component
class ServerIdProvider {
    private val serverId: String = try {
        InetAddress.getLocalHost().hostName
    } catch (e: Exception) {
        UUID.randomUUID().toString() // fallback
    }

    fun get(): String = serverId
}
