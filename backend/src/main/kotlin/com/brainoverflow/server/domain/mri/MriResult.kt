package com.brainoverflow.server.domain.mri

import jakarta.persistence.*

@Entity
class MriResult(
    mriImage: MriImage,
    predictionStatus: PredictionStatus,
    targetAge: Int,
) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mriImage_id")
    val mriImage: MriImage = mriImage

    @Enumerated(value = EnumType.STRING)
    var predictionStatus: PredictionStatus = predictionStatus
        protected set

    var resultFilePath: String? = null

    var targetAge: Int = targetAge

    fun changeStatus(predictionStatus: PredictionStatus) {
        this.predictionStatus = predictionStatus
    }

    fun addFilePath(filePath: String) {
        this.resultFilePath = filePath
    }
}
