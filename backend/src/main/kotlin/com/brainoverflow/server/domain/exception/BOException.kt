package com.brainoverflow.server.domain.exception

class BOException(private val returnCode: ReturnCode) : RuntimeException() {
    private val code: String = returnCode.code
    private val msg: String = returnCode.message

    fun getReturnCode(): ReturnCode = this.returnCode

    fun getCode(): String = this.code

    fun getMsg(): String = this.msg
}
