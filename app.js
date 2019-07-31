//app.js
const curl = require('./config').host;
App({
  onLaunch: function (options) {
    console.log(options);
    // 展示本地存储能力
    var self = this;
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              console.log(res.userInfo)
              var nickName = res.userInfo.nickName;
              var avatarUrl = res.userInfo.avatarUrl;
              wx.setStorageSync('nickName', nickName);
              wx.setStorageSync('avatarUrl', avatarUrl);
            }
          })
        }
      }
    })

  },
  
  http: function (url, data='', method="GET") { //封装http请求
    const apiUrl = 'http://shopdz.shopdz.cn/' //请求域名
    console.log(this.globalData)
    const currency = {
      //openid: this.globalData.openid
    }
    return new Promise((resolve, reject) => {
      wx.request({
        url: apiUrl + url,
        header: {
          'content-type': 'application/x-www-form-urlencoded' // 默认值
        },
        data: Object.assign(currency,data),
        method: method,
        success: function (res) {
          if(res.data.code != 200){
            wx.showModal({
              title: '提示',
              content: res.data.message,
              success: function (res) {
                if (res.confirm) {
                  console.log('用户点击确定')
                } else if (res.cancel) {
                  console.log('用户点击取消')
                }
              }
            })
          }
          resolve(res.data)
        },
        fail: function (res) {
          reject(res);
        },
        complete: function () {
          console.log('complete');
        }
      })
    })
  },
  
  globalData: {
    userInfo: null,
    openid:null,
    nickName: null,
    avatarUrl: null,
    num:0,
  }
})