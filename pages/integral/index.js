// pages/coupon/index.js
const app = getApp();
// var curl = 'https://miniapp.shopdz.cn/';
const curl = require('../../config').host;
Page({
  /**
   * 页面的初始数据
   */
  data: {
    tabIndex: 1,
    list: [],
    is_display:false,
    total:'',
  },
  //获取用户所以收藏
  getList:function(){
    var self = this;
    var key = wx.getStorageSync('key');
    var page = '1';
    wx.request({
      url: curl +'api.php/member/getpointslist',
      data:{key:key,page:page},
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      method: 'POST',
      success:function(res){
        if(res.data.code == 0){
          var orderlist = res.data.data.points_list;
          var total = res.data.data.pointsum;
          if(total.length >5){
            total = total.substring(0,5) + '+';
          }
          console.log(total.length);
          self.setData({
            list: orderlist,
            total: total,
          });
        }
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getList()
  },
  //点击随便逛逛返回首页
  jump:function(){
    wx.switchTab({
      url: '../index/index',
    });
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