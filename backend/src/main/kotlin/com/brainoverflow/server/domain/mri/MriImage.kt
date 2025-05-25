package com.brainoverflow.server.domain.mri

import com.brainoverflow.server.domain.user.User
import jakarta.persistence.*
import java.util.*

@Entity
class MriImage(
    user: User,
    filePath: String,
    age: Int,
    gender: Gender,
) {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null

    @ManyToOne(fetch = FetchType.LAZY)
    val user: User = user

    val filePath: String = filePath // ← 실제 저장 경로

    val age: Int = age
    val gender: Gender = gender

    @OneToMany(mappedBy = "mriImage")
    val mriResults: List<MriResult> = listOf()
}
