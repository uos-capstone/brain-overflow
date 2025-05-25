package com.brainoverflow.server.external.controller.chat

import com.brainoverflow.server.external.controller.response.ApiResponse
import com.brainoverflow.server.external.dto.request.chat.CreateRoomDto
import com.brainoverflow.server.external.dto.response.chat.ChatRoomsResponse
import com.brainoverflow.server.external.dto.response.chat.ChatUserData
import com.brainoverflow.server.external.dto.response.chat.SocketMessageResponse
import com.brainoverflow.server.service.chatroom.ChatRoomService
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/rooms")
class ChatRoomController(
    private val chatRoomService: ChatRoomService,
) {
    @PostMapping
    fun create(
        @RequestBody createRoomDto: CreateRoomDto,
        @AuthenticationPrincipal user: UserDetails,
    ): ApiResponse<Long> {
        val userId = UUID.fromString(user.username)
        val roomId = chatRoomService.create(createRoomDto, userId)
        return ApiResponse.success(roomId)
    }

    @PostMapping("/{roomId}/invite")
    fun invite(
        @PathVariable roomId: Long,
        @RequestParam("userId") targetUserId: UUID,
        @AuthenticationPrincipal userDetails: UserDetails,
    ): ApiResponse<Void> {
        val userId = UUID.fromString(userDetails.username)
        chatRoomService.invite(userId, targetUserId, roomId)
        return ApiResponse.success()
    }

    @PostMapping("/{roomId}/join")
    fun joinRoom(
        @PathVariable roomId: Long,
        @AuthenticationPrincipal userDetails: UserDetails,
    ): ApiResponse<Void> {
        val userId = UUID.fromString(userDetails.username)
        chatRoomService.join(userId, roomId)
        return ApiResponse.success()
    }

    @GetMapping("/chatroom")
    fun getChatRoomList(
        @AuthenticationPrincipal user: UserDetails,
    ): ChatRoomsResponse {
        val userId = UUID.fromString(user.username)
        val userChatRooms = chatRoomService.getUsersChatList(userId)
        return ChatRoomsResponse(userChatRooms)
    }

    @GetMapping("/chatroom/{roomId}")
    fun getChatroomMessages(
        @PathVariable roomId: Long,
        @RequestParam page: Int,
    ): Page<SocketMessageResponse> {
        val pageable = PageRequest.of(page, 100)
        return chatRoomService.getMessagesFromRoom(pageable, roomId)
    }

    @GetMapping("/chatroom/{roomId}/members")
    fun getChatRoomMembers(
        @PathVariable roomId: Long,
    ): ApiResponse<List<ChatUserData>> {
        val allUserInChatRoom = chatRoomService.getAllUserInChatRoom(roomId)
        return ApiResponse.success(allUserInChatRoom)
    }
}
