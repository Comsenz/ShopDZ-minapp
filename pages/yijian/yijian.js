const app = getApp();
// var curl = 'https://miniapp.shopdz.cn/';
const curl = require('../../config').host;
// pages/yijian/yijian.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    name:null,
    contentCount: 0,
    order_message:null,
  },

  //姓名
  bindKeyName: function (e) {
    this.setData({
      name: e.detail.value
    })
  },
  //实时获取textarea里的内容
  bindTextAreaBlur: function (e) {
    var contentCount = e.detail.value.length
    if (contentCount.length == 500){
      wx.showToast({
        title: '文字到五百了，请削减少量文字在提交。',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    this.setData({
      order_message: e.detail.value,
      contentCount: contentCount,
    })
  },

  feedback:function(){
    var self = this; 
    var phone = self.data.name;
    var order_message = self.data.order_message;
    if (!order_message){
      wx.showToast({
        title: '反馈意见不能为空',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    if (order_message.length > 500){
      wx.showToast({
        title: '反馈意见字数太多了，请削减少量文字，在提交！',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    var key = wx.getStorageSync('key');
    wx.request({
      url: curl +'api.php/FeedBack/feedback',
      data: { key: key, phone: phone, message: order_message},
      method:'GET',
      success:function(res){
        if(res.data.code == 0){
          wx.showToast({
            title: '意见反馈成功',
            icon: 'success',
            duration: 2000
          });
          setTimeout(function () {
            wx.switchTab({
              url: '../user/index',
            });
          }, 2000);
        }else{
          wx.showToast({
            title: res.data.msg,
            icon: 'none',
            duration: 2000
          });
        }
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

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

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})