package com.brainoverflow.server.api.controller

import com.brainoverflow.server.common.enums.ReturnCode
import com.brainoverflow.server.common.exception.BOException
import com.brainoverflow.server.common.response.ApiResponse
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.validation.BindingResult
import org.springframework.validation.FieldError
import org.springframework.web.HttpRequestMethodNotSupportedException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.MissingServletRequestParameterException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException
import java.sql.SQLException

@RestControllerAdvice
class GlobalControllerAdvice {
	private val logger = LoggerFactory.getLogger(javaClass)

	@ExceptionHandler(BOException::class)
	fun handleLbException(e: BOException): ResponseEntity<ApiResponse<Unit>> {
		logger.error(e.getMsg())

		return ResponseEntity
			.status(HttpStatus.BAD_REQUEST)
			.body(ApiResponse.fail(e.getReturnCode()))
	}

	@ExceptionHandler(
		value = [
			HttpMessageNotReadableException::class,
			MissingServletRequestParameterException::class,
			MethodArgumentTypeMismatchException::class
		]
	)
	fun handleRequestException(e: Exception): ResponseEntity<ApiResponse<Unit>> {
		return ResponseEntity
			.status(HttpStatus.BAD_REQUEST)
			.body(ApiResponse.fail(ReturnCode.WRONG_PARAMETER))
	}

	@ExceptionHandler(HttpRequestMethodNotSupportedException::class)
	fun handleMethodNotSupportedException(e: HttpRequestMethodNotSupportedException, request: HttpServletRequest): ResponseEntity<ApiResponse<Unit>> {
		return ResponseEntity
			.status(HttpStatus.METHOD_NOT_ALLOWED)
			.body(ApiResponse.fail(ReturnCode.METHOD_NOT_ALLOWED))
	}

	@ExceptionHandler(MethodArgumentNotValidException::class)
	fun badRequestExHandler(bindingResult: BindingResult): ResponseEntity<ApiResponse<List<FieldError>>> {
		return ResponseEntity
			.status(HttpStatus.BAD_REQUEST)
			.body(
				ApiResponse.fail(
					ReturnCode.WRONG_PARAMETER,
					bindingResult.fieldErrors
				)
			)
	}

	@ExceptionHandler(
		value = [SQLException::class]
	)
	fun handleServerException(e: SQLException, request: HttpServletRequest): ResponseEntity<ApiResponse<Unit>> {
//		slackService.sendSlackForError(e, request)
		return ResponseEntity
			.status(HttpStatus.INTERNAL_SERVER_ERROR)
			.body(ApiResponse.error(ReturnCode.INTERNAL_SERVER_ERROR))
	}

	@ExceptionHandler(
		value = [RuntimeException::class]
	)
	fun handleBusinessException(e: RuntimeException, request: HttpServletRequest): ResponseEntity<ApiResponse<Unit>> {
//		slackService.sendSlackForError(e, request)
		logger.error(e.message, e)
		return ResponseEntity
			.status(HttpStatus.INTERNAL_SERVER_ERROR)
			.body(ApiResponse.error(ReturnCode.INTERNAL_SERVER_ERROR))
	}
}