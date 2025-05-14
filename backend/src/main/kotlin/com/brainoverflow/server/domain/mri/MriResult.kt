package com.brainoverflow.server.domain.mri

import jakarta.persistence.*

@Entity
class MriResult(
    mriImage: MriImage,
    predictionStatus: PredictionStatus
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

    fun changeStatus(predictionStatus: PredictionStatus) {
        this.predictionStatus = predictionStatus
    }

    fun addComment(comment: String) {
        this.resultFilePath = comment
    }

}