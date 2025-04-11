package com.brainoverflow.server.domain.mri

import org.springframework.data.jpa.repository.JpaRepository

interface MriResultRepository : JpaRepository<MriResult, Long> {
}