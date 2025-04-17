package com.brainoverflow.server.api.controller.chat

import com.brainoverflow.server.api.dto.request.chat.CreateRoomDto
import com.brainoverflow.server.common.response.ApiResponse
import com.brainoverflow.server.domain.chat.ChatRoom
import com.brainoverflow.server.service.chat.ChatRoomService
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/rooms")
class ChatRoomController(
    private val chatRoomService: ChatRoomService
) {
    @PostMapping
    fun create(@RequestBody createRoomDto: CreateRoomDto,
               @AuthenticationPrincipal user: UserDetails) : ApiResponse<Void> {
        val userId = UUID.fromString(user.username)
        chatRoomService.create(createRoomDto, userId)
        return ApiResponse.success()
    }

    @PostMapping("/{roomId}/invite")
    fun invite(@PathVariable roomId: Long,
               @RequestParam("userId") targetUserId: UUID,
               @AuthenticationPrincipal userDetails: UserDetails)
    : ApiResponse<Void> {
        val userId = UUID.fromString(userDetails.username)
        chatRoomService.invite(userId, targetUserId, roomId)
        return ApiResponse.success()
    }
}
