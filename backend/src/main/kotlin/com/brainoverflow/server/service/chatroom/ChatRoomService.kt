package com.brainoverflow.server.service.chatroom

import com.brainoverflow.server.domain.chat.*
import com.brainoverflow.server.domain.exception.ReturnCode
import com.brainoverflow.server.domain.exception.BOException
import com.brainoverflow.server.domain.user.User
import com.brainoverflow.server.external.dto.request.chat.CreateRoomDto
import com.brainoverflow.server.external.dto.response.chat.SocketMessageResponse
import com.brainoverflow.server.external.dto.response.chat.ChatRoomDto
import com.brainoverflow.server.external.dto.response.chat.ChatUserData
import com.brainoverflow.server.service.UserService
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
@Transactional(readOnly = true)
class ChatRoomService(
    private val chatRoomRepository: ChatRoomRepository,
    private val chatRoomUserRepository: ChatRoomUserRepository,
    private val userService: UserService,
    private val chatMessageRepository: ChatMessageRepository
) {
    @Transactional
    fun create(createRoomDto: CreateRoomDto, userId: UUID): Long {
        val user = userService.getByUserId(userId)
        val chatRoom = createRoomDto.toChatRoom(user)
        chatRoomRepository.save(chatRoom)

        val roomUser = ChatRoomUser(chatRoom = chatRoom, user = user)
        val newRoom = chatRoomUserRepository.save(roomUser)
        return newRoom.id
    }

    @Transactional
    fun invite(inviteUserId: UUID, targetUserId: UUID, roomId: Long) {
        val inviteUser = userService.getByUserId(inviteUserId)
        val chatRoom = chatRoomRepository.findByIdOrNull(roomId)
            ?: throw BOException(ReturnCode.ROOM_NOT_EXIST)
        checkUserInRoom(chatRoom, inviteUser)

        val targetUser = userService.getByUserId(targetUserId)
        val roomUser = ChatRoomUser(chatRoom = chatRoom, user = targetUser)
        chatRoomUserRepository.save(roomUser)
    }

    @Transactional
    fun join(joinUserId: UUID, roomId: Long) {
        val joinUser = userService.getByUserId(joinUserId)
        val chatRoom = chatRoomRepository.findByIdOrNull(roomId)
            ?: throw BOException(ReturnCode.ROOM_NOT_EXIST)

        val roomUser = ChatRoomUser(chatRoom = chatRoom, user = joinUser)
        chatRoomUserRepository.save(roomUser)
    }

    private fun checkUserInRoom(chatRoom: ChatRoom, user: User) {
        chatRoomUserRepository.findByUserAndChatRoom(user, chatRoom)
            ?: throw BOException(ReturnCode.USER_NOT_IN_ROOM)
    }

    fun getUsersChatList(userId: UUID): List<ChatRoomDto> {
        val user = userService.getByUserId(userId)
        val roomUsers = chatRoomUserRepository.findByUser(user)
        return roomUsers.map { it.chatRoom }
            .map {
                val messagesFromRoom = getMessagesFromRoom(PageRequest.of(0, 1), it.id)
                ChatRoomDto.from(it, messagesFromRoom.content)
            }
    }

    fun getMessagesFromRoom(pageable: PageRequest, roomId: Long): Page<SocketMessageResponse> {
        val documents = chatMessageRepository.findByRoomId(roomId = roomId, pageable = pageable)
        return documents.map { SocketMessageResponse.fromChat(it) }
    }

    fun getAllUserInChatRoom(roomId: Long): List<ChatUserData> {
        val room = chatRoomRepository.findByIdOrNull(roomId)
            ?: throw BOException(ReturnCode.ROOM_NOT_EXIST)
        val users = room.chatRoomUser.map {
            it.user
        }
        return users.map { ChatUserData(it.id, it.nickname) }
    }


}
