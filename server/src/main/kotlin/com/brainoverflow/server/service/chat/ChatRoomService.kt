package com.brainoverflow.server.service.chat

import com.brainoverflow.server.api.dto.request.chat.CreateRoomDto
import com.brainoverflow.server.domain.exception.ReturnCode
import com.brainoverflow.server.domain.exception.BOException
import com.brainoverflow.server.domain.chat.ChatRoom
import com.brainoverflow.server.domain.chat.ChatRoomUser
import com.brainoverflow.server.domain.chat.ChatRoomUserRepository
import com.brainoverflow.server.domain.chat.ChatRoomRepository
import com.brainoverflow.server.domain.user.User
import com.brainoverflow.server.service.UserService
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
@Transactional(readOnly = true)
class ChatRoomService(
    private val chatRoomRepository: ChatRoomRepository,
    private val chatRoomUserRepository: ChatRoomUserRepository,
    private val userService: UserService
) {
    @Transactional
    fun create(createRoomDto: CreateRoomDto, userId: UUID) {
        val user = userService.getByUserId(userId)
        val chatRoom = createRoomDto.toChatRoom(user)
        chatRoomRepository.save(chatRoom)

        val roomUser = ChatRoomUser(chatRoom = chatRoom, user = user)
        chatRoomUserRepository.save(roomUser)
    }

    @Transactional
    fun invite(inviteUserId: UUID, targetUserId: UUID, roomId: Long) {
        val inviteUser = userService.getByUserId(inviteUserId)
        val chatRoom = chatRoomRepository.findByIdOrNull(roomId)
            ?: throw BOException(ReturnCode.WRONG_PARAMETER)
        checkUserInRoom(chatRoom, inviteUser)

        val targetUser = userService.getByUserId(targetUserId)
        val roomUser = ChatRoomUser(chatRoom = chatRoom, user = targetUser)
        chatRoomUserRepository.save(roomUser)
    }

    private fun checkUserInRoom(chatRoom: ChatRoom, user: User) {
        chatRoomUserRepository.findByUserAndChatRoom(user, chatRoom)
            ?: throw BOException(ReturnCode.USER_NOT_IN_ROOM)
    }

    fun getAllUserChatRooms(userId: UUID): List<com.brainoverflow.server.external.dto.response.chat.ChatRoomDto> {
        val user = userService.getByUserId(userId)
        val roomUsers = chatRoomUserRepository.findByUser(user)
        return roomUsers.map { it.chatRoom }
            .map { com.brainoverflow.server.external.dto.response.chat.ChatRoomDto.from(it) }
    }

}
