package com.brainoverflow.server.domain.mri

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface MriImageRepository : JpaRepository<MriImage, UUID> {
//    fun findByIdOrNull(id : UUID) = findByIdOrNull(id)
}
