package com.brainoverflow.server.domain.user

import com.brainoverflow.server.domain.mri.MriImage
import jakarta.persistence.*
import java.util.UUID

@Entity(name = "users")
class User(
    nickname: String,
    role: Role,
    username: String,
    password: String
) {
    @Id
    val id: UUID = UUID.randomUUID()

    var nickname: String = nickname

    @Enumerated(value = EnumType.STRING)
    val role: Role = role
    val username: String = username
    val password: String = password

    @OneToMany(mappedBy = "user")
    val mriImages: List<MriImage> = emptyList()
}