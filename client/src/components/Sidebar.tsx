function Sidebar() {
    return (
        <div style={{
            width: '60px',
            backgroundColor: '#1e1e1e',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '100vh',
            // padding: '20px 0',
            boxSizing: 'border-box'
        }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* <div style={{ margin: '20px 0' }}>📁</div> */}
                <div style={{ margin: '20px 0' }}>🔍</div>
            </div>

            <div style={{ marginBottom: '20px' }}>⚙️</div>
        </div>
    );
}

export default Sidebar;
