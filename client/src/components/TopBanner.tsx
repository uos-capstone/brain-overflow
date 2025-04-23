function TopBanner() {
    return (
        <div style={{
            backgroundColor: '#1e1e1e',
            color: 'white',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            flexShrink: 0
        }}>
            <div style={{
                fontWeight: 'bold',
                fontSize: '48px'
            }}>
                MRI Viewer
            </div>
        </div>
    );
}

export default TopBanner;
