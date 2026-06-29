export const getPortForRole = (role) => {
  switch (role) {
    case 'admin': return '5176'
    case 'staff': return '5175'
    case 'student': return '5174'
    case 'parent': return '5173'
    default: return '5173'
  }
}

export const getRoleFromPort = () => {
  const port = window.location.port
  if (port === '5176') return 'admin'
  if (port === '5175') return 'staff'
  if (port === '5174') return 'student'
  return 'parent'
}

export const redirectToPort = (port, path = '/') => {
  const hostname = window.location.hostname
  const protocol = window.location.protocol
  window.location.href = `${protocol}//${hostname}:${port}${path}`
}
