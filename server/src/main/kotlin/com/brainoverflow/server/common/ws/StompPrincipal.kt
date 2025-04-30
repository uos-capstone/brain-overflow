package com.brainoverflow.server.common.ws

import java.security.Principal

class StompPrincipal(private val name: String) : Principal {
    override fun getName(): String = name
}