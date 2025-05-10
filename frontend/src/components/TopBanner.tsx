function TopBanner() {
    return (
        <div>
            <div className="w-full bg-[#1e1e1e] text-white py-16 flex flex-col gap-8 flex-shrink-0 px-6">
                <h1 className="text-5xl font-extrabold drop-shadow-sm">MRI Generator</h1>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
                {/* 설명 섹션 */}
                <section className="text-gray-300 text-base leading-relaxed max-w-prose mx-auto">
                    <p>
                        <strong className="text-white">BrainOverflow</strong>는 MRI 데이터를 기반으로 인지 기능 저하 예측을 위한 분석 도구입니다.
                    </p>
                    <p>
                        사용자는 NIfTI(.nii) 형식의 뇌 영상을 업로드하여 AI 기반 분석을 수행할 수 있습니다.
                    </p>
                    <p>
                        드래그 앤 드롭 방식으로 MRI 파일을 손쉽게 업로드할 수 있습니다.
                    </p>
                </section>
            </div>
        </div>
    );
}

export default TopBanner;
