export const loginTestData = {
  valid: {
    username: 'admin',
    password: 'admin123'
  },
  invalid: {
    username: 'admin',
    password: 'wrongpassword'
  },
  empty: {
    username: '',
    password: ''
  }
};

export const vehicleTestData = {
  valid: {
    plateNumber: '粤B12345',
    owner: 'Test User',
    phone: '13800138000',
    type: 'car'
  }
};

export const parkingTestData = {
  valid: {
    name: 'Test Parking',
    totalSpaces: 100,
    type: 'underground'
  }
};

export const systemTestData = {
  user: {
    username: 'testuser',
    password: 'password123'
  }
};

export const userTestData = {
  valid: {
    username: 'newuser',
    password: 'password123',
    name: 'New User'
  }
};

export const pageRoutes = {
  dashboard: '/dashboard',
  parking: '/parking',
  vehicle: '/vehicle',
  system: '/system',
  login: '/login'
};

export const roleTestData = {
  valid: {
    name: 'Test Role',
    description: 'Test Role Description'
  }
};

export const apiTestData = {
  endpoints: {
    login: '/api/auth/login',
    userInfo: '/api/user/info'
  }
};
