package com.brainoverflow.server.service

import com.brainoverflow.server.domain.exception.BOException
import com.brainoverflow.server.domain.exception.ReturnCode
import com.brainoverflow.server.domain.user.User
import com.brainoverflow.server.domain.user.UserRepository
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import java.util.*

@Service
class UserService(
    private val userRepository: UserRepository,
) {
    fun getByUserId(userId: UUID): User =
        userRepository.findByIdOrNull(userId)
            ?: throw BOException(ReturnCode.NOT_EXIST_USER)
}
