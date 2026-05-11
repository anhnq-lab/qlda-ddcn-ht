const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprYWRkamxsc2VlcGhzaWFxdmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyOTg2NzAsImV4cCI6MjA5Mzg3NDY3MH0.8jWqJsgw6yy_PknJHBXU0-J_1jFZhE7MGV-E5J-Nen0';

function decodeJwt(token: string) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(Buffer.from(base64, 'base64').toString().split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

console.log('Decoded Anon Key Payload:');
console.log(decodeJwt(anonKey));
