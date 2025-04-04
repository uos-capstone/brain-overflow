package com.brainoverflow.server.common.response

import com.brainoverflow.server.common.enums.ReturnCode

data class ApiResponse<T>(
	val code: String,
	val message: String,
	val data: T?
) {

	companion object {
		fun <T> success(data: T? = null): ApiResponse<T> {
			return ApiResponse(
				ReturnCode.SUCCESS.code,
				ReturnCode.SUCCESS.message,
				data
			)
		}

		fun <T> fail(returnCode: ReturnCode, data: T? = null): ApiResponse<T> {
			return ApiResponse(returnCode.code, returnCode.message, data)
		}

		fun <T> error(returnCode: ReturnCode): ApiResponse<T> {
			return ApiResponse(returnCode.code, returnCode.message, null)
		}
	}
}