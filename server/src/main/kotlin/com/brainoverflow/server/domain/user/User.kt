package com.brainoverflow.server.domain.user

import com.brainoverflow.server.common.enums.Role
import jakarta.persistence.Entity
import jakarta.persistence.Id
import java.util.UUID

@Entity(name = "users")
class User (
    nickname : String,
    role: Role,
    username : String,
    password : String
){
    @Id
    private val id: UUID = UUID.randomUUID()

    var nickname:String = nickname
    val role : Role = role
    val username : String = username
    val password : String = password
}