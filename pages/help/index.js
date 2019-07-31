// pages/coupon/index.js
const app = getApp();
var WxParse = require('../../plugins/wxParse/wxParse.js');  
// var curl = 'https://miniapp.shopdz.cn/';
const curl = require('../../config').host;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    tabIndex:1,
    title:null,
  },
  is_problem:function(id){
    var self = this;
    var id= id;
    var key = wx.getStorageSync('key');
    if(id){
      wx.request({
        url: curl +'api.php/Cms/getcms',
        data: { key: key, cms_id:id},
        method:'GET',
        success:function(res){
          console.log(res);
          if(res.data.code == 0){
            var title = res.data.data.article_title;
            WxParse.wxParse('article', 'html', res.data.data.article_content, self);
            self.setData({
              title:title,
            })
          }
        }
      })
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var self= this;
    // console.log(options);
    var id = options.id;
    self.is_problem(id);
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