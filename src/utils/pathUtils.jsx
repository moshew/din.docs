// Simple path utilities for browser environment
export const path = {
  join(...parts) {
    return parts
      .map((part, i) => {
        if (i === 0) {
          return part.trim().replace(/[\/]*$/g, '')
        } else {
          return part.trim().replace(/(^[\/]*|[\/]*$)/g, '')
        }
      })
      .filter(x => x.length)
      .join('/')
  },

  dirname(path) {
    return path.replace(/\\/g, '/').replace(/\/[^\/]*$/, '') || '/'
  }
};