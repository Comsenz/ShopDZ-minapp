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
    list:[],
    img:[],
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options.goods_id)
    var self = this;
    if (options.goods_id){
      self.not_used(options.goods_id);
    }
  },
  //未使用
  not_used: function (goods_id){
    var self = this;
    var goods_id = goods_id;
    var key = wx.getStorageSync('key');
    wx.request({
      url: curl +'api.php/plugin/index/code/group/action/detail',
      data: { key:key, active_id:goods_id},
      method:'GET',
      success:function(res){
        if(res.data.code == 0){
          console.log(list);
          var list = res.data.data.group;
          var img = res.data.data.goods;
          console.log(list);
          WxParse.wxParse('article', 'html', img.goods_detail, self, 5);
          self.setData({
            list:list,
            img:img,
          });
        }
        
      }
    })
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