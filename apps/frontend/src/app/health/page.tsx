// Health check page - bypasses middleware
export default function Health() {
  return (
    <html>
      <head>
        <title>Health Check</title>
      </head>
      <body style={{ 
        padding: '50px', 
        background: 'white',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div>
          <h1 style={{ color: 'green' }}>✅ Frontend Working!</h1>
          <p style={{ color: 'black', fontSize: '18px', marginTop: '20px' }}>
            Postiz Frontend is running correctly.
          </p>
          
          <div style={{ marginTop: '30px' }}>
            <h2 style={{ color: 'black' }}>Available Routes:</h2>
            <ul style={{ color: 'black', fontSize: '16px' }}>
              <li><a href="/auth/login" style={{ color: 'blue' }}>/auth/login</a></li>
              <li><a href="/third-party" style={{ color: 'blue' }}>/third-party</a></li>
              <li><a href="/launches" style={{ color: 'blue' }}>/launches</a></li>
              <li><a href="/analytics" style={{ color: 'blue' }}>/analytics</a></li>
            </ul>
          </div>
          
          <div style={{ 
            marginTop: '30px', 
            padding: '20px', 
            background: '#f0f0f0',
            borderRadius: '8px'
          }}>
            <h3 style={{ color: 'black', marginBottom: '10px' }}>Environment Info:</h3>
            <pre style={{ color: 'black', fontSize: '14px' }}>
              {JSON.stringify({
                NODE_ENV: process.env.NODE_ENV,
                NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'not set',
                BUILD_TIME: new Date().toISOString()
              }, null, 2)}
            </pre>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <p style={{ color: 'gray', fontSize: '14px' }}>
              Railway Deployment Test - motivated-blessing
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}

