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
    id:null,
    member_id:null,
  },
  // //获取用户所以收藏
  // getList:function(){
  //   var self = this;
  //   var key = wx.getStorageSync('key');
  //   // var page = '1';
  //   wx.request({
  //     url: curl +'api.php/FootPrint/getFootPrint',
  //     data:{key:key},
  //     header: {
  //       'content-type': 'application/x-www-form-urlencoded' // 默认值
  //     },
  //     method: 'POST',
  //     success:function(res){
  //       console.log(res);
  //       if(res.data.code == 0){
  //         var orderlist = res.data.data.list;
  //         console.log(orderlist);
  //         self.setData({
  //           list: orderlist,
  //         });
  //       }
  //     }
  //   })
  // },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // this.getList()
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