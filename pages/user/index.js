// pages/user/index.js
const app = getApp();
// var curl = 'https://miniapp.shopdz.cn/';
const curl = require('../../config').host;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    sign:0,
    is_sign:1,
    if_number:false,
    enterprise_contact: '',
    points:null,
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var self = this;

    self.information();
    self.kefudianhua();
    
    // 获取用户信息 是否授权
    wx.getSetting({
      success: res => {

        if (res.authSetting['scope.userInfo']) {
          this.setData({
            usershow: false,
          })
        } else {
          this.setData({
            usershow: true,
          })
        }
      }
    });
  },
  contact:function(e){
    var tel = this.data.enterprise_contact;
    if(tel){
      // wx.showModal({
      //   title: '客服电话',
      //   cancelText: "取消", //默认是“取消”
      //   confirmText: "确定", //默认是“确定”
      //   // showCancel:false,
      //   content: tel + '点击确定拨打客服电话',
      //   success(res) {
      //     if (res.cancel) {
      //       console.log('隐藏');
      //     } else {
            wx.makePhoneCall({
              phoneNumber: tel,
            })
      //     }
      //   }
      // })
    }else{
      wx.showModal({
        title: '后台暂未设置客服手机号',
        // cancelText: "取消", //默认是“取消”
        // confirmText: "确定", //默认是“确定”
        showCancel:false,
        // content: tel + '点击确定拨打客服电话',
        success(res) {
        }
      })
    }
    
    // var self = this;
    // var type = e.currentTarget.dataset.type;
    // if(type == 1){
    //   self.setData({
    //     if_number: true,
    //   });
    // } else if (type == 2){
    //   self.setData({
    //     if_number: false,
    //   });
    // }
  },
  kefudianhua:function(){
    var self = this;
    wx.request({
      url: curl +'api.php/index/getSettings',
      method:'GET',
      success:function(res){
        console.log(res.data.data);
        var enterprise_contact = res.data.data.enterprise_contact;
        self.setData({
          enterprise_contact: enterprise_contact,
        })
      }
    })
  },

  hide_mask: function () {
    var that = this;
    setTimeout(function () {
      that.setData({
        hasUserInfo: true,
        usershow: false,
      })
    }, 200)
  },

  getUserInfo: function (e) {
    var that = this;
    if (e.detail.userInfo) {
      console.log(e.detail.userInfo);
      app.globalData.userInfo = e.detail.userInfo

    } else {
      //用户按了拒绝按钮
      wx.showModal({
        title: '警告',
        content: '您点击了拒绝授权，将无法进入小程序，请授权之后再进入!!!',
        showCancel: false,
        confirmText: '返回授权',
        success: function (res) {
          if (res.confirm) {
            that.setData({
              hasUserInfo: false,
              usershow: true,
            })
            console.log('用户点击了“返回授权”')
          }
        },
        complete: function () {
          that.setData({
            hasUserInfo: false,
            usershow: true,
          })
        }
      })
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.onLoad();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  sign:function(){
    var self = this;
    var key = wx.getStorageSync('key');
    var is_sign = self.data.is_sign;
    if (is_sign ==0){
      console.log("您已经签到过了");
    }else{
      wx.request({
        url: curl +'api.php/member/sign_in?key='+key,
        method:'GET',
        success:function(res){
          if(res.data.code ==0){
            var points = res.data.data.points;
            self.setData({
              is_sign:2,
              points: points,
            });
          } else if (res.data.code == 1){
            self.setData({
              is_sign: 0,
            });
          }
        }
      })
    }
  },
  close:function(){
    var self = this;
    self.setData({
      is_sign: 0,
    })
  },
  information:function(){
    var self = this;
    var key = wx.getStorageSync('key');
    wx.request({
      url: curl +'api.php/member/getMemberInfo?key='+key,
      method:'GET',
      success:function(res){
        console.log(res);
        if(res.data.code ==0){
          var is_sign = res.data.data.is_sign;
          self.setData({
            is_sign: is_sign,
          })
        }
      }
    })
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})