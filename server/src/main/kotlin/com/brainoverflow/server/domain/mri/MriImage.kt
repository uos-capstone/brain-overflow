package com.brainoverflow.server.domain.mri

import com.brainoverflow.server.domain.user.User
import jakarta.persistence.*
import java.io.Serializable
import java.util.*
import kotlin.collections.ArrayList

@Entity
class MriImage(
    user: User
) {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id : UUID? = null

    @ManyToOne(fetch = FetchType.LAZY)
    val user:User = user

    @OneToMany(mappedBy = "mriImage")
    val mriResults : List<MriResult> = listOf()
}